using UnrealBuildTool;

public class BylaVSetiTarget : TargetRules
{
	public BylaVSetiTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("BylaVSeti");
	}
}
