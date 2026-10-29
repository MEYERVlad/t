#pragma once

#include "CoreMinimal.h"
#include "Gameplay/InteractableActor.h"
#include "CaseObjectActor.generated.h"

class UAnimationAsset;

/**
 * Предмет дела: папка, распечатка, телефон, человек на допросе.
 * Всё поведение берётся из Content/Data/Case/objects.json по ObjectId.
 */
UCLASS()
class BYLAVSETI_API ACaseObjectActor : public AInteractableActor
{
	GENERATED_BODY()

public:
	virtual void BeginPlay() override;
	virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
	virtual FText GetPrompt() const override;
	virtual void Interact(ADetectiveCharacter* Detective) override;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Case")
	FName ObjectId;

	/** Спрятать серую модель, но оставить «невидимую зону» для взаимодействия (когда на этом месте стоит MetaHuman). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Case")
	bool bHideMesh = false;

	/** Акторы, которые появляются и исчезают вместе с этим предметом (например, MetaHuman персонажа). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Case")
	TArray<TObjectPtr<AActor>> LinkedActors;

	/** Анимация стояния, которая включается на теле (компонент Body) связанных персонажей при старте уровня. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Case")
	TObjectPtr<UAnimationAsset> IdleAnimation;

private:
	/** Прячет предмет, пока сюжет до него не дошёл (ShowFlag в objects.json). */
	void UpdateVisibility();

	/** Включает IdleAnimation на связанных персонажах. */
	void StartIdleAnimations();

	FDelegateHandle ChangedHandle;
};
