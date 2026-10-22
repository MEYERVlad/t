#include "Gameplay/LaptopActor.h"

#include "Case/CaseStateSubsystem.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/GameInstance.h"
#include "Gameplay/DetectiveCharacter.h"
#include "Gameplay/DetectivePlayerController.h"

ALaptopActor::ALaptopActor()
{
	Mesh->SetRelativeScale3D(FVector(0.35f, 0.25f, 0.02f));
}

FText ALaptopActor::GetPrompt() const
{
	if (const UGameInstance* GI = GetGameInstance())
	{
		if (const UCaseStateSubsystem* Case = GI->GetSubsystem<UCaseStateSubsystem>())
		{
			return Case->UI(TEXT("prompt_laptop"));
		}
	}
	return FText::GetEmpty();
}

void ALaptopActor::Interact(ADetectiveCharacter* Detective)
{
	if (!Detective)
	{
		return;
	}
	if (ADetectivePlayerController* PC = Cast<ADetectivePlayerController>(Detective->GetController()))
	{
		PC->OpenLaptop();
	}
}
