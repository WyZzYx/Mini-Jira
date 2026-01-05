using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniJira.Api.DTOs;
using MiniJira.Api.Services;
using TaskStatus = MiniJira.Api.Models.TaskStatus;

namespace MiniJira.Api.Controllers;

[ApiController]
public class TasksController : ControllerBase
{
    private readonly TasksService _svc;

    public TasksController(TasksService svc)
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
    [HttpGet("api/projects/{projectId}/tasks")]
    public async Task<ActionResult<PagedResponse<TaskDto>>> ListForProject(
        string projectId,
        [FromQuery] TaskStatus? status,
        [FromQuery] MiniJira.Api.Models.TaskPriority? priority,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (callerId, roles) = Caller();
        try
        {
            var res = await _svc.ListForProjectAsync(callerId, roles, projectId, status, priority, page, pageSize);
            return Ok(res);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpPost("api/projects/{projectId}/tasks")]
    public async Task<ActionResult<TaskDto>> Create(string projectId, [FromBody] CreateTaskRequest req)
    {
        var (callerId, roles) = Caller();
        try
        {
            var dto = await _svc.CreateAsync(callerId, roles, projectId, req);
            return CreatedAtAction(nameof(GetById), new { taskId = dto.Id }, dto);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException e) { return BadRequest(e.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpGet("api/tasks/{taskId}")]
    public async Task<ActionResult<TaskDto>> GetById(string taskId)
    {
        var (callerId, roles) = Caller();
        try
        {
            return Ok(await _svc.GetByIdAsync(callerId, roles, taskId));
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpPut("api/tasks/{taskId}")]
    public async Task<IActionResult> Update(string taskId, [FromBody] UpdateTaskRequest req)
    {
        var (callerId, roles) = Caller();
        try
        {
            await _svc.UpdateAsync(callerId, roles, taskId, req);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException e) { return BadRequest(e.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpDelete("api/tasks/{taskId}")]
    public async Task<IActionResult> Delete(string taskId)
    {
        var (callerId, roles) = Caller();
        try
        {
            await _svc.DeleteAsync(callerId, roles, taskId);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    // ----- Assignees -----
    [Authorize]
    [HttpPost("api/tasks/{taskId}/assignees/{userId}")]
    public async Task<IActionResult> Assign(string taskId, string userId)
    {
        var (callerId, roles) = Caller();
        try
        {
            await _svc.AssignAsync(callerId, roles, taskId, userId);
            return NoContent();
        }
        catch (KeyNotFoundException e) { return NotFound(e.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpDelete("api/tasks/{taskId}/assignees/{userId}")]
    public async Task<IActionResult> Unassign(string taskId, string userId)
    {
        var (callerId, roles) = Caller();
        try
        {
            await _svc.UnassignAsync(callerId, roles, taskId, userId);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}
