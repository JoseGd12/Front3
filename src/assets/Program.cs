using Microsoft.EntityFrameworkCore;
using BarberiaApi.Models;
using System.Text.Json.Serialization;
using BarberiaApi.Services;


var builder = WebApplication.CreateBuilder(args);

// =======================
// 🔧 SERVICES
// =======================

// 📦 Base de datos
builder.Services.AddDbContext<BarberiaContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// 🌐 CORS (permitir frontend)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// 🎮 Controllers + JSON config
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var navigationProperties = new[]
            {
                "Barbero", "Cliente", "Servicio", "Paquete", "Proveedor",
                "Producto", "Venta", "Compra", "DetalleVenta", "DetalleCompras",
                "Categoria", "Rol", "Empleado", "UsuarioRegistra", "Modulo"
            };

            foreach (var prop in navigationProperties)
            {
                if (context.ModelState.ContainsKey(prop))
                    context.ModelState.Remove(prop);
            }

            if (context.ModelState.IsValid)
                return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(context.ModelState);

            var result = new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(context.ModelState);
            result.ContentTypes.Add("application/json");
            return result;
        };
    });

// 📘 Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IPhotoService, PhotoService>();


var app = builder.Build();

// =======================
// 🚀 MIDDLEWARE
// =======================

// 📘 Swagger siempre activo
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Barberia API v1");
    c.RoutePrefix = string.Empty;
});

app.UseHttpsRedirection();

// 🌐 CORS (IMPORTANTE: antes de Authorization)
app.UseCors("AllowFrontend");

app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

app.Run();
