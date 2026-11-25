using ProjectScientDay2568.Utility;

namespace ProjectScientDay2568.Helper
{
    /// <summary>
    /// Decides which role a newly registered account may receive.
    /// Anyone may register as a normal user, but the admin role can only be granted
    /// by an existing admin, or to the very first account while no admin exists yet.
    /// </summary>
    public static class RegisterRolePolicy
    {
        /// <param name="requestedRole">Role asked for in the request (untrusted input).</param>
        /// <param name="callerIsAdmin">True when the authenticated caller is already an admin.</param>
        /// <param name="adminExists">True when at least one admin account already exists.</param>
        /// <param name="role">The role to assign when the request is allowed.</param>
        /// <returns>False when the request asks for admin without being allowed to.</returns>
        public static bool TryResolve(string? requestedRole, bool callerIsAdmin, bool adminExists, out string role)
        {
            var wantsAdmin = string.Equals(requestedRole?.Trim(), SD.Role_Admin, StringComparison.OrdinalIgnoreCase);

            if (!wantsAdmin)
            {
                role = SD.Role_User;
                return true;
            }

            if (callerIsAdmin || !adminExists)
            {
                role = SD.Role_Admin;
                return true;
            }

            role = SD.Role_User;
            return false;
        }
    }
}
