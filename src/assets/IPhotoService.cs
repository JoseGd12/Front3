using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace BarberiaApi.Services
{
    public interface IPhotoService
    {
        Task<PhotoUploadResult> AddPhotoAsync(IFormFile file);
        Task<PhotoDeletionResult> DeletePhotoAsync(string publicId);
    }

    public sealed class PhotoUploadResult
    {
        public string? Url { get; init; }
        public string? FileName { get; init; }
        public string? Error { get; init; }
    }

    public sealed class PhotoDeletionResult
    {
        public bool Success { get; init; }
        public string? FileName { get; init; }
        public string? Error { get; init; }
    }
}
