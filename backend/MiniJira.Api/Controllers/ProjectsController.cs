using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniJira.Api.DTOs;
using MiniJira.Api.Services;

namespace MiniJira.Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly ProjectsService _svc;

    public ProjectsController(ProjectsService svc)
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
    [HttpGet]
    public async Task<ActionResult<PagedResponse<ProjectListItemDto>>> List(
        [FromQuery] string? query,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool includeArchived = false)
    {
        var (userId, roles) = Caller();
        try
        {
            return Ok(await _svc.ListAsync(userId, roles, query, page, pageSize, includeArchived));
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDetailDto>> Get(string id)
    {
        var (userId, roles) = Caller();
        try
        {
            return Ok(await _svc.GetAsync(userId, roles, id));
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ProjectDetailDto>> Create([FromBody] CreateProjectRequest req)
    {
        var (userId, roles) = Caller();
        try
        {
            var dto = await _svc.CreateAsync(userId, roles, req);
            return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
        }
        catch (ArgumentException e) { return BadRequest(e.Message); }
        catch (InvalidOperationException e) { return Conflict(e.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateProjectRequest req)
    {
        var (userId, roles) = Caller();
        try
        {
            await _svc.UpdateAsync(userId, roles, id, req);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException e) { return BadRequest(e.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    // ----- Members -----
    [Authorize]
    [HttpGet("{id}/members")]
    public async Task<ActionResult<List<MemberDto>>> Members(string id)
    {
        var (userId, roles) = Caller();
        try
        {
            return Ok(await _svc.ListMembersAsync(userId, roles, id));
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(string id, [FromBody] AddMemberRequest req)
    {
        var (userId, roles) = Caller();
        try
        {
            await _svc.AddMemberAsync(userId, roles, id, req);
            return NoContent();
        }
        catch (KeyNotFoundException e) { return NotFound(e.Message); }
        catch (ArgumentException e) { return BadRequest(e.Message); }
        catch (InvalidOperationException e) { return Conflict(e.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpPut("{id}/members/{userId}")]
    public async Task<IActionResult> UpdateMemberRole(string id, string userId, [FromBody] UpdateMemberRoleRequest req)
    {
        var (callerId, roles) = Caller();
        try
        {
            await _svc.UpdateMemberRoleAsync(callerId, roles, id, userId, req);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException e) { return BadRequest(e.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [Authorize]
    [HttpDelete("{id}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(string id, string userId)
    {
        var (callerId, roles) = Caller();
        try
        {
            await _svc.RemoveMemberAsync(callerId, roles, id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException e) { return BadRequest(e.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteProject(string id)
    {
        try
        {
            await _svc.DeleteProjectAdminAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
