#pragma once

#include "CoreMinimal.h"
#include "Gameplay/InteractableActor.h"
#include "CaseObjectActor.generated.h"

/**
 * Предмет дела: папка, распечатка, телефон, человек на допросе.
 * Всё поведение берётся из Content/Data/Case/objects.json по ObjectId.
 */
UCLASS()
class BYLAVSETI_API ACaseObjectActor : public AInteractableActor
{
	GENERATED_BODY()

public:
	virtual FText GetPrompt() const override;
	virtual void Interact(ADetectiveCharacter* Detective) override;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Case")
	FName ObjectId;
};
