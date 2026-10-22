#include "Gameplay/DetectiveCharacter.h"

#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "Engine/LocalPlayer.h"
#include "Engine/World.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Gameplay/DetectivePlayerController.h"
#include "Gameplay/InteractableActor.h"
#include "InputAction.h"
#include "InputMappingContext.h"
#include "InputModifiers.h"

ADetectiveCharacter::ADetectiveCharacter()
{
	PrimaryActorTick.bCanEverTick = true;

	GetCapsuleComponent()->InitCapsuleSize(40.f, 90.f);

	Camera = CreateDefaultSubobject<UCameraComponent>(TEXT("Camera"));
	Camera->SetupAttachment(GetCapsuleComponent());
	Camera->SetRelativeLocation(FVector(0.f, 0.f, 70.f));
	Camera->bUsePawnControlRotation = true;
	Camera->SetFieldOfView(80.f);

	bUseControllerRotationYaw = true;
	GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;
}

void ADetectiveCharacter::PostInitializeComponents()
{
	Super::PostInitializeComponents();
	GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;
	CreateInput();
}

void ADetectiveCharacter::CreateInput()
{
	if (Mapping)
	{
		return;
	}

	MoveAction = NewObject<UInputAction>(this, TEXT("IA_Move"));
	MoveAction->ValueType = EInputActionValueType::Axis2D;

	LookAction = NewObject<UInputAction>(this, TEXT("IA_Look"));
	LookAction->ValueType = EInputActionValueType::Axis2D;

	InteractAction = NewObject<UInputAction>(this, TEXT("IA_Interact"));
	InteractAction->ValueType = EInputActionValueType::Boolean;

	Mapping = NewObject<UInputMappingContext>(this, TEXT("IMC_Detective"));

	// WASD -> вектор (X = вправо, Y = вперёд).
	{
		FEnhancedActionKeyMapping& W = Mapping->MapKey(MoveAction, EKeys::W);
		W.Modifiers.Add(NewObject<UInputModifierSwizzleAxis>(this));

		FEnhancedActionKeyMapping& S = Mapping->MapKey(MoveAction, EKeys::S);
		S.Modifiers.Add(NewObject<UInputModifierSwizzleAxis>(this));
		S.Modifiers.Add(NewObject<UInputModifierNegate>(this));

		FEnhancedActionKeyMapping& A = Mapping->MapKey(MoveAction, EKeys::A);
		A.Modifiers.Add(NewObject<UInputModifierNegate>(this));

		Mapping->MapKey(MoveAction, EKeys::D);
	}

	// Мышь: Y инвертируем, как в шаблоне от первого лица.
	{
		FEnhancedActionKeyMapping& Mouse = Mapping->MapKey(LookAction, EKeys::Mouse2D);
		UInputModifierNegate* NegateY = NewObject<UInputModifierNegate>(this);
		NegateY->bX = false;
		NegateY->bY = true;
		NegateY->bZ = false;
		Mouse.Modifiers.Add(NegateY);
	}

	Mapping->MapKey(InteractAction, EKeys::E);
	Mapping->MapKey(InteractAction, EKeys::LeftMouseButton);
}

void ADetectiveCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);
	CreateInput();

	if (APlayerController* PC = Cast<APlayerController>(GetController()))
	{
		if (UEnhancedInputLocalPlayerSubsystem* Input = ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(PC->GetLocalPlayer()))
		{
			Input->ClearAllMappings();
			Input->AddMappingContext(Mapping, 0);
		}
	}

	if (UEnhancedInputComponent* EIC = Cast<UEnhancedInputComponent>(PlayerInputComponent))
	{
		EIC->BindAction(MoveAction, ETriggerEvent::Triggered, this, &ADetectiveCharacter::Move);
		EIC->BindAction(LookAction, ETriggerEvent::Triggered, this, &ADetectiveCharacter::Look);
		EIC->BindAction(InteractAction, ETriggerEvent::Started, this, &ADetectiveCharacter::Interact);
	}
}

void ADetectiveCharacter::Move(const FInputActionValue& Value)
{
	const FVector2D Axis = Value.Get<FVector2D>();
	AddMovementInput(GetActorForwardVector(), Axis.Y);
	AddMovementInput(GetActorRightVector(), Axis.X);
}

void ADetectiveCharacter::Look(const FInputActionValue& Value)
{
	const FVector2D Axis = Value.Get<FVector2D>();
	AddControllerYawInput(Axis.X);
	AddControllerPitchInput(Axis.Y);
}

void ADetectiveCharacter::Interact()
{
	if (AInteractableActor* Target = Focused.Get())
	{
		Target->Interact(this);
	}
}

void ADetectiveCharacter::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
	UpdateFocus();
}

void ADetectiveCharacter::UpdateFocus()
{
	ADetectivePlayerController* PC = Cast<ADetectivePlayerController>(GetController());
	if (!PC || !Camera)
	{
		return;
	}

	const FVector Start = Camera->GetComponentLocation();
	const FVector End = Start + Camera->GetForwardVector() * InteractDistance;

	FHitResult Hit;
	FCollisionQueryParams Params(SCENE_QUERY_STAT(DetectiveInteract), false, this);

	AInteractableActor* NewFocus = nullptr;
	if (GetWorld()->LineTraceSingleByChannel(Hit, Start, End, ECC_Visibility, Params))
	{
		NewFocus = Cast<AInteractableActor>(Hit.GetActor());
	}

	Focused = NewFocus;
	PC->SetInteractionPrompt(NewFocus ? NewFocus->GetPrompt() : FText::GetEmpty());
}
