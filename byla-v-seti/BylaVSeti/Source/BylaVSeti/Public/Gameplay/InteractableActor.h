#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "InteractableActor.generated.h"

class ADetectiveCharacter;
class UStaticMeshComponent;

/** Базовый предмет, на который можно навести взгляд и нажать E. */
UCLASS(Abstract)
class BYLAVSETI_API AInteractableActor : public AActor
{
	GENERATED_BODY()

public:
	AInteractableActor();

	/** Текст подсказки под прицелом (без "[E]"). */
	virtual FText GetPrompt() const;

	virtual void Interact(ADetectiveCharacter* Detective);

protected:
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Interaction")
	TObjectPtr<UStaticMeshComponent> Mesh;
};
