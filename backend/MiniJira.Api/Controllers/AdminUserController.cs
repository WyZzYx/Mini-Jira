using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniJira.Api.DTOs;
using MiniJira.Api.Services;

namespace MiniJira.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "ADMIN")]
public class AdminUserController : ControllerBase
{
    private readonly AdminUsersService _svc;

    public AdminUserController(AdminUsersService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<PagedResponse<AdminUserDto>>> List([FromQuery] string? query = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(await _svc.ListAsync(query, page, pageSize));

    [HttpPut("{id}/roles")]
    public async Task<IActionResult> UpdateRoles(string id, [FromBody] UpdateUserRolesRequest req)
    {
        await _svc.UpdateRolesAsync(id, req);
        return NoContent();
    }

    [HttpPut("{id}/department")]
    public async Task<IActionResult> UpdateDepartment(string id, [FromBody] UpdateUserDepartmentRequest req)
    {
        await _svc.UpdateDepartmentAsync(id, req);
        return NoContent();
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetUserPasswordRequest req)
    {
        await _svc.ResetPasswordAsync(id, req);
        return NoContent();
    }
}