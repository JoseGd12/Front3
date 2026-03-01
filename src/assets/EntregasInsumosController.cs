using BarberiaApi.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BarberiaApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EntregasInsumosController : ControllerBase
    {
        private readonly BarberiaContext _context;

        public EntregasInsumosController(BarberiaContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EntregasInsumo>>> GetAll()
        {
            return await _context.EntregasInsumos
                .Include(e => e.Barbero)
                .Include(e => e.Usuario)
                .OrderByDescending(e => e.Fecha)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EntregasInsumo>> GetById(int id)
        {
            var entrega = await _context.EntregasInsumos
                .Include(e => e.Barbero)
                .Include(e => e.Usuario)
                .Include(e => e.DetalleEntregasInsumos)
                    .ThenInclude(d => d.Producto)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entrega == null) return NotFound();
            return Ok(entrega);
        }

        [HttpPost]
        public async Task<ActionResult<EntregasInsumo>> Create([FromBody] EntregaInput input)
        {
            if (input == null || input.Detalles == null || !input.Detalles.Any())
                return BadRequest("La entrega debe tener al menos un detalle");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var entrega = new EntregasInsumo
                {
                    BarberoId = input.BarberoId,
                    UsuarioId = input.UsuarioId,
                    Fecha = DateTime.Now,
                    Estado = "Entregado"
                };

                int cantidadTotal = 0;
                decimal valorTotal = 0;

                foreach (var detInput in input.Detalles)
                {
                    var producto = await _context.Productos.FindAsync(detInput.ProductoId);
                    if (producto == null) return BadRequest($"Producto {detInput.ProductoId} no encontrado");

                    if (producto.StockInsumos < detInput.Cantidad)
                        return BadRequest($"Stock insuficiente para el producto {producto.Nombre}");

                    var detalle = new DetalleEntregasInsumo
                    {
                        ProductoId = detInput.ProductoId,
                        Cantidad = detInput.Cantidad,
                        PrecioHistorico = producto.PrecioVenta 
                    };

                    cantidadTotal += detInput.Cantidad;
                    // Fix: Ensure we use value or 0 for decimal? to decimal addition
                    valorTotal += (detalle.PrecioHistorico ?? 0) * detInput.Cantidad;

                    producto.StockInsumos = Math.Max(0, producto.StockInsumos - detInput.Cantidad);
                    producto.StockTotal = producto.StockVentas + producto.StockInsumos;

                    entrega.DetalleEntregasInsumos.Add(detalle);
                }

                entrega.CantidadTotal = cantidadTotal;
                entrega.ValorTotal = valorTotal;

                _context.EntregasInsumos.Add(entrega);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetById), new { id = entrega.Id }, entrega);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<EntregasInsumo>> Update(int id, [FromBody] EntregasInsumo entrega)
        {
            if (id != entrega.Id) return BadRequest();

            var entregaExistente = await _context.EntregasInsumos
                .Include(e => e.Barbero)
                .Include(e => e.Usuario)
                .Include(e => e.DetalleEntregasInsumos)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entregaExistente == null) return NotFound();

            // Solo permitir actualizar ciertos campos para proteger la integridad
            entregaExistente.BarberoId = entrega.BarberoId;
            entregaExistente.UsuarioId = entrega.UsuarioId;
            // No permitir actualizar Fecha, CantidadTotal, ValorTotal o Estado aquí

            try
            {
                await _context.SaveChangesAsync();
                return Ok(entregaExistente);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.EntregasInsumos.AnyAsync(e => e.Id == id))
                    return NotFound();
                throw;
            }
        }

        [HttpPut("{id}/estado")]
        public async Task<ActionResult<CambioEstadoResponse<EntregasInsumo>>> CambiarEstado(int id, [FromBody] CambioEstadoInput input)
        {
            var entrega = await _context.EntregasInsumos
                .Include(e => e.Barbero)
                .Include(e => e.Usuario)
                .Include(e => e.DetalleEntregasInsumos)
                    .ThenInclude(d => d.Producto)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entrega == null) return NotFound();

            // Validar que el estado no sea nulo o vacío
            if (string.IsNullOrWhiteSpace(input.estado))
                return BadRequest("El estado es requerido");

            // Estados válidos para entregas
            var estadosValidos = new[] { "Entregado", "Anulado", "Pendiente", "Parcial" };
            if (!estadosValidos.Contains(input.estado))
                return BadRequest($"Estado no válido. Estados permitidos: {string.Join(", ", estadosValidos)}");

            // Validaciones específicas por estado
            if (input.estado == "Anulado" && entrega.Estado == "Anulado")
                return BadRequest("La entrega ya está anulada");

            if (input.estado == "Entregado" && entrega.Estado == "Anulado")
                return BadRequest("No se puede reactivar una entrega anulada");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var estadoAnterior = entrega.Estado;
                entrega.Estado = input.estado;

                // Si se anula la entrega, restaurar stock
                if (input.estado == "Anulado" && estadoAnterior != "Anulado")
                {
                    foreach (var detalle in entrega.DetalleEntregasInsumos)
                    {
                        var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                        if (producto != null)
                        {
                            producto.StockInsumos += detalle.Cantidad;
                            producto.StockTotal = producto.StockVentas + producto.StockInsumos;
                        }
                    }
                }
                // Si se reactiva (solo desde Pendiente/Parcial), volver a restar stock
                else if (input.estado == "Entregado" && estadoAnterior != "Anulado" && estadoAnterior != "Entregado")
                {
                    foreach (var detalle in entrega.DetalleEntregasInsumos)
                    {
                        var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                        if (producto != null)
                        {
                            if (producto.StockInsumos >= detalle.Cantidad)
                            {
                                producto.StockInsumos = Math.Max(0, producto.StockInsumos - detalle.Cantidad);
                                producto.StockTotal = producto.StockVentas + producto.StockInsumos;
                            }
                            else
                            {
                                await transaction.RollbackAsync();
                                return BadRequest($"Stock insuficiente para reactivar la entrega. Producto: {producto.Nombre}, Stock actual: {producto.StockInsumos}, Requerido: {detalle.Cantidad}");
                            }
                        }
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var response = new CambioEstadoResponse<EntregasInsumo>
                {
                    entidad = entrega,
                    mensaje = $"Entrega actualizada de '{estadoAnterior}' a '{input.estado}' exitosamente",
                    exitoso = true
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }
    }
}
