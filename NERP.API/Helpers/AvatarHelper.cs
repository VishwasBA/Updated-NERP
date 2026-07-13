using System;

namespace EmployeeRecognition.API.Helpers;

public static class AvatarHelper
{
    public static string GetInitials(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return "??";

        var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length > 1)
        {
            string firstChar = parts[0].Substring(0, 1).ToUpperInvariant();
            string lastChar = parts[parts.Length - 1].Substring(0, 1).ToUpperInvariant();
            return firstChar + lastChar;
        }
        else
        {
            string word = parts[0];
            return (word.Length >= 2 ? word.Substring(0, 2) : word).ToUpperInvariant();
        }
    }

    public static string GetAvatarUrl(string name, string avatarField)
    {
        if (!string.IsNullOrEmpty(avatarField) && (avatarField.StartsWith("http://") || avatarField.StartsWith("https://")))
        {
            return avatarField;
        }
        return $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(name)}";
    }
}
