using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniJira.Api.DTOs;
using MiniJira.Api.Services;

namespace MiniJira.Api.Controllers;

[ApiController]
[Route("api/me")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly MeService _me;

    public MeController(MeService me) => _me = me;

    [HttpGet]
    public async Task<ActionResult<MeResponse>> Get()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        return Ok(await _me.GetMeAsync(userId));
    }
}