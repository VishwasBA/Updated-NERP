using System;

namespace EmployeeRecognition.API.Helpers;

public static class AvatarHelper
{
    public static string GetInitials(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return "??";

        var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var firstWord = parts[0];
        return (firstWord.Length >= 2 ? firstWord.Substring(0, 2) : firstWord).ToUpperInvariant();
    }

    public static string GetAvatarUrl(string name, string avatarField)
    {
        var initials = GetInitials(name);
        return $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(initials)}&rounded=true&background=3b82f6&color=fff";
    }
}
