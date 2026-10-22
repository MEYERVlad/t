using UnrealBuildTool;

public class BylaVSetiEditorTarget : TargetRules
{
	public BylaVSetiEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("BylaVSeti");
	}
}
