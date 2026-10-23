#include "Gameplay/CaseObjectActor.h"

#include "Case/CaseStateSubsystem.h"
#include "Engine/GameInstance.h"
#include "Gameplay/DetectiveCharacter.h"
#include "Gameplay/DetectivePlayerController.h"
#include "Kismet/GameplayStatics.h"

void ACaseObjectActor::BeginPlay()
{
	Super::BeginPlay();
	if (UGameInstance* GI = GetGameInstance())
	{
		if (UCaseStateSubsystem* Case = GI->GetSubsystem<UCaseStateSubsystem>())
		{
			ChangedHandle = Case->OnCaseChanged.AddUObject(this, &ACaseObjectActor::UpdateVisibility);
		}
	}
	UpdateVisibility();
}

void ACaseObjectActor::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
	if (UGameInstance* GI = GetGameInstance())
	{
		if (UCaseStateSubsystem* Case = GI->GetSubsystem<UCaseStateSubsystem>())
		{
			Case->OnCaseChanged.Remove(ChangedHandle);
		}
	}
	Super::EndPlay(EndPlayReason);
}

void ACaseObjectActor::UpdateVisibility()
{
	const UGameInstance* GI = GetGameInstance();
	const UCaseStateSubsystem* Case = GI ? GI->GetSubsystem<UCaseStateSubsystem>() : nullptr;
	const bool bVisible = !Case || Case->IsObjectVisible(ObjectId);
	SetActorHiddenInGame(!bVisible);
	SetActorEnableCollision(bVisible);
}

FText ACaseObjectActor::GetPrompt() const
{
	if (const UGameInstance* GI = GetGameInstance())
	{
		if (const UCaseStateSubsystem* Case = GI->GetSubsystem<UCaseStateSubsystem>())
		{
			return Case->GetObjectPrompt(ObjectId);
		}
	}
	return FText::FromName(ObjectId);
}

void ACaseObjectActor::Interact(ADetectiveCharacter* Detective)
{
	UGameInstance* GI = GetGameInstance();
	UCaseStateSubsystem* Case = GI ? GI->GetSubsystem<UCaseStateSubsystem>() : nullptr;
	if (!Case || !Detective)
	{
		return;
	}

	FText Message;
	FName InterrogationId;
	FName TravelMap;
	Case->UseObject(ObjectId, Message, InterrogationId, TravelMap);

	if (!TravelMap.IsNone())
	{
		// Состояние дела живёт в GameInstance и переживает смену уровня.
		UGameplayStatics::OpenLevel(this, TravelMap);
		return;
	}

	if (ADetectivePlayerController* PC = Cast<ADetectivePlayerController>(Detective->GetController()))
	{
		if (!InterrogationId.IsNone())
		{
			PC->OpenInterrogation(InterrogationId);
		}
		else
		{
			PC->ShowToast(Message);
		}
	}
}
