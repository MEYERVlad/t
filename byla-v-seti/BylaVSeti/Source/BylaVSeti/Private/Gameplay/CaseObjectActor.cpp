#include "Gameplay/CaseObjectActor.h"

#include "Case/CaseStateSubsystem.h"
#include "Engine/GameInstance.h"
#include "Gameplay/DetectiveCharacter.h"
#include "Gameplay/DetectivePlayerController.h"

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
	Case->UseObject(ObjectId, Message, InterrogationId);

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
