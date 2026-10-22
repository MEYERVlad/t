#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "DetectiveCharacter.generated.h"

class AInteractableActor;
class UCameraComponent;
class UInputAction;
class UInputMappingContext;
struct FInputActionValue;

/**
 * Следователь от первого лица: ходьба, обзор, взаимодействие по E.
 * Управление создаётся прямо в коде, отдельные ассеты Input Action не нужны.
 */
UCLASS()
class BYLAVSETI_API ADetectiveCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	ADetectiveCharacter();

	virtual void PostInitializeComponents() override;
	virtual void Tick(float DeltaSeconds) override;
	virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

protected:
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera")
	TObjectPtr<UCameraComponent> Camera;

	/** Дальность взаимодействия, см. */
	UPROPERTY(EditAnywhere, Category = "Interaction")
	float InteractDistance = 250.f;

	UPROPERTY(EditAnywhere, Category = "Movement")
	float WalkSpeed = 280.f;

private:
	void CreateInput();
	void Move(const FInputActionValue& Value);
	void Look(const FInputActionValue& Value);
	void Interact();
	void UpdateFocus();

	UPROPERTY(Transient)
	TObjectPtr<UInputMappingContext> Mapping;

	UPROPERTY(Transient)
	TObjectPtr<UInputAction> MoveAction;

	UPROPERTY(Transient)
	TObjectPtr<UInputAction> LookAction;

	UPROPERTY(Transient)
	TObjectPtr<UInputAction> InteractAction;

	TWeakObjectPtr<AInteractableActor> Focused;
};
