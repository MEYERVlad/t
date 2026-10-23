#pragma once

#include "CoreMinimal.h"
#include "GameFramework/SaveGame.h"
#include "Case/CaseTypes.h"
#include "CaseSaveGame.generated.h"

UCLASS()
class BYLAVSETI_API UCaseSaveGame : public USaveGame
{
	GENERATED_BODY()

public:
	UPROPERTY()
	TArray<FName> KnownEvidence;

	UPROPERTY()
	TArray<FName> Flags;

	UPROPERTY()
	TArray<FName> PublishedFeed;

	UPROPERTY()
	TArray<FCaseLink> Links;

	UPROPERTY()
	TArray<FName> ConfirmedHypotheses;

	UPROPERTY()
	TArray<FName> DecidedDecisions;

	UPROPERTY()
	TArray<FName> UsedObjects;

	UPROPERTY()
	TArray<FName> BrokenStatements;

	UPROPERTY()
	TArray<FName> FinishedInterrogations;

	UPROPERTY()
	TMap<FName, FVector2D> CardPositions;

	UPROPERTY()
	FName ReachedEnding;

	UPROPERTY()
	int32 Trust = 60;
};
