#include "Gameplay/InteractableActor.h"

#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMesh.h"
#include "UObject/ConstructorHelpers.h"

AInteractableActor::AInteractableActor()
{
	PrimaryActorTick.bCanEverTick = false;

	Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
	RootComponent = Mesh;
	Mesh->SetCollisionProfileName(TEXT("BlockAll"));

	// Серый куб по умолчанию: потом заменим на настоящие модели.
	static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("/Engine/BasicShapes/Cube.Cube"));
	if (CubeMesh.Succeeded())
	{
		Mesh->SetStaticMesh(CubeMesh.Object);
	}
}

FText AInteractableActor::GetPrompt() const
{
	return FText::GetEmpty();
}

void AInteractableActor::Interact(ADetectiveCharacter* Detective)
{
}
