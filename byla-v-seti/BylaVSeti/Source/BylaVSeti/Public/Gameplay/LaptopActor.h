#pragma once

#include "CoreMinimal.h"
#include "Gameplay/InteractableActor.h"
#include "LaptopActor.generated.h"

/** Служебный ноутбук на столе. E открывает интерфейс. */
UCLASS()
class BYLAVSETI_API ALaptopActor : public AInteractableActor
{
	GENERATED_BODY()

public:
	ALaptopActor();

	virtual FText GetPrompt() const override;
	virtual void Interact(ADetectiveCharacter* Detective) override;
};
