using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniJira.Api.DTOs;
using MiniJira.Api.Services;

namespace MiniJira.Api.Controllers;

[ApiController]
public class CommentsController : ControllerBase
{
    private readonly CommentsService _svc;

    public CommentsController(CommentsService svc)
    {
        _svc = svc;
    }

    private (string userId, List<string> roles) Caller()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).Distinct().ToList();
        return (userId, roles);
    }

    [Authorize]
    [HttpGet("api/tasks/{taskId}/comments")]
    public async Task<ActionResult<List<CommentDto>>> List(string taskId)
    {
        var (callerId, roles) = Caller();
        try
        {
            return Ok(await _svc.ListAsync(callerId, roles, taskId));
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpPost("api/tasks/{taskId}/comments")]
    public async Task<ActionResult<CommentDto>> Create(string taskId, [FromBody] CreateCommentRequest req)
    {
        var (callerId, roles) = Caller();
        try
        {
            return Ok(await _svc.CreateAsync(callerId, roles, taskId, req));
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException e) { return BadRequest(e.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}