using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniJira.Api.DTOs;
using MiniJira.Api.Services;

namespace MiniJira.Api.Controllers;

[ApiController]
[Route("api/admin/departments")]
[Authorize(Roles = "ADMIN")]
public class AdminDepartmentController : ControllerBase
{
    private readonly AdminDepartmentsService _svc;

    public AdminDepartmentController(AdminDepartmentsService svc)
    {
        _svc = svc;
    }

    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> List()
        => Ok(await _svc.ListAsync());

    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> Create([FromBody] CreateDepartmentRequest req)
        => Ok(await _svc.CreateAsync(req));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateDepartmentRequest req)
    {
        await _svc.UpdateAsync(id, req);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _svc.DeleteAsync(id);
        return NoContent();
    }
}