using ProjectScientDay2568.Helper;
using ProjectScientDay2568.Utility;

namespace ProjectScientDay2568.Tests.Services;

public class RegisterRolePolicyTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("user")]
    [InlineData("something-else")]
    public void NormalRegistration_AlwaysGetsUserRole(string? requested)
    {
        var allowed = RegisterRolePolicy.TryResolve(requested, callerIsAdmin: false, adminExists: true, out var role);

        Assert.True(allowed);
        Assert.Equal(SD.Role_User, role);
    }

    [Theory]
    [InlineData("admin")]
    [InlineData("Admin")]
    [InlineData("ADMIN")]
    [InlineData("  admin ")]
    public void AnonymousCaller_CannotCreateAdmin_WhenAnAdminAlreadyExists(string requested)
    {
        var allowed = RegisterRolePolicy.TryResolve(requested, callerIsAdmin: false, adminExists: true, out var role);

        Assert.False(allowed);
        Assert.Equal(SD.Role_User, role);
    }

    [Fact]
    public void ExistingAdmin_CanCreateAdmin()
    {
        var allowed = RegisterRolePolicy.TryResolve("admin", callerIsAdmin: true, adminExists: true, out var role);

        Assert.True(allowed);
        Assert.Equal(SD.Role_Admin, role);
    }

    [Fact]
    public void FirstEverAccount_CanBecomeAdmin_WhenNoAdminExists()
    {
        var allowed = RegisterRolePolicy.TryResolve("admin", callerIsAdmin: false, adminExists: false, out var role);

        Assert.True(allowed);
        Assert.Equal(SD.Role_Admin, role);
    }
}
