using BarberiaApi.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace BarberiaApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagesController : ControllerBase
    {
        private readonly IPhotoService _photoService;

        public ImagesController(IPhotoService photoService)
        {
            _photoService = photoService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No se proporcionó ningún archivo.");

            var result = await _photoService.AddPhotoAsync(file);
            if (!string.IsNullOrWhiteSpace(result.Error))
                return BadRequest(result.Error);

            if (string.IsNullOrWhiteSpace(result.Url))
                return BadRequest("No se pudo generar la URL de la imagen.");

            return Ok(new
            {
                url = result.Url,
                relativeUrl = result.Url,
                fileName = result.FileName
            });
        }

        [HttpDelete("{publicId}")]
        public async Task<IActionResult> DeleteImage(string publicId)
        {
            var result = await _photoService.DeletePhotoAsync(publicId);
            if (!string.IsNullOrWhiteSpace(result.Error))
            {
                if (result.Error == "Imagen no encontrada") return NotFound(result.Error);
                return BadRequest(result.Error);
            }

            return Ok(new { message = "Imagen eliminada exitosamente", fileName = result.FileName });
        }
    }
}
