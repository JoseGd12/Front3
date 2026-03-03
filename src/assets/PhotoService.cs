using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace BarberiaApi.Services
{
    public class PhotoService : IPhotoService
    {
        private readonly IWebHostEnvironment _environment;

        public PhotoService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public async Task<PhotoUploadResult> AddPhotoAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return new PhotoUploadResult { Error = "No se proporcionó ningún archivo." };

            if (file.Length > 10 * 1024 * 1024)
                return new PhotoUploadResult { Error = "El archivo supera el tamaño máximo permitido (10MB)." };

            var contentType = (file.ContentType ?? string.Empty).Trim().ToLowerInvariant();
            if (!contentType.StartsWith("image/"))
                return new PhotoUploadResult { Error = "El archivo debe ser una imagen." };

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var ext = Path.GetExtension(file.FileName ?? string.Empty).ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(ext) || !allowedExtensions.Contains(ext))
                return new PhotoUploadResult { Error = "Formato de imagen no permitido. Usa JPG, PNG o WEBP." };

            var webRoot = _environment.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRoot))
                webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");

            var relativeDir = Path.Combine("assets", "images");
            var saveDir = Path.Combine(webRoot, relativeDir);
            Directory.CreateDirectory(saveDir);

            var fileName = $"{Guid.NewGuid():N}{ext}";
            var physicalPath = Path.Combine(saveDir, fileName);

            await using (var stream = File.Create(physicalPath))
            {
                await file.CopyToAsync(stream);
            }

            var relativeUrl = $"/assets/images/{fileName}";
            return new PhotoUploadResult { Url = relativeUrl, FileName = fileName };
        }

        public async Task<PhotoDeletionResult> DeletePhotoAsync(string publicId)
        {
            if (string.IsNullOrWhiteSpace(publicId))
                return new PhotoDeletionResult { Success = false, Error = "Nombre de archivo inválido" };

            var fileName = Path.GetFileName(publicId);
            if (string.IsNullOrWhiteSpace(fileName))
                return new PhotoDeletionResult { Success = false, Error = "Nombre de archivo inválido" };

            var webRoot = _environment.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRoot))
                webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");

            var physicalPath = Path.Combine(webRoot, "assets", "images", fileName);
            if (!File.Exists(physicalPath))
                return new PhotoDeletionResult { Success = false, FileName = fileName, Error = "Imagen no encontrada" };

            await Task.Run(() => File.Delete(physicalPath));
            return new PhotoDeletionResult { Success = true, FileName = fileName };
        }
    }
}
