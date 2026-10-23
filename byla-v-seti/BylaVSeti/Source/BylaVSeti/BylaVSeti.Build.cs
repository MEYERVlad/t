using UnrealBuildTool;

public class BylaVSeti : ModuleRules
{
	public BylaVSeti(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		// Каждый .cpp собирается отдельно: в файлах есть одинаковые служебные имена в анонимных пространствах.
		bUseUnity = false;

		PublicDependencyModuleNames.AddRange(new string[]
		{
			"Core",
			"CoreUObject",
			"Engine",
			"InputCore",
			"EnhancedInput",
			"UMG",
			"Slate",
			"SlateCore",
			"Json",
			"JsonUtilities",
			"WebSockets"
		});
	}
}
