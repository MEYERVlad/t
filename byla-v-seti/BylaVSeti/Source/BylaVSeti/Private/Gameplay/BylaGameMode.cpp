#include "Gameplay/BylaGameMode.h"

#include "Gameplay/DetectiveCharacter.h"
#include "Gameplay/DetectivePlayerController.h"

ABylaGameMode::ABylaGameMode()
{
	DefaultPawnClass = ADetectiveCharacter::StaticClass();
	PlayerControllerClass = ADetectivePlayerController::StaticClass();
}
