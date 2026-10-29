#include "Audio/VoiceSubsystem.h"

#include "Components/AudioComponent.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"
#include "Sound/SoundBase.h"
#include "UObject/SoftObjectPath.h"

DEFINE_LOG_CATEGORY_STATIC(LogVoice, Log, All);

bool UVoiceSubsystem::Play(FName VoiceId)
{
	Stop();
	if (!bVoiceEnabled || VoiceId.IsNone())
	{
		return false;
	}
	const FString Name = VoiceId.ToString();
	const FSoftObjectPath Path(FString::Printf(TEXT("/Game/Voice/%s.%s"), *Name, *Name));
	USoundBase* Sound = Cast<USoundBase>(Path.TryLoad());
	if (!Sound)
	{
		UE_LOG(LogVoice, Verbose, TEXT("No voice file for %s"), *Name);
		return false;
	}
	UWorld* World = GetGameInstance() ? GetGameInstance()->GetWorld() : nullptr;
	if (!World)
	{
		return false;
	}
	Current = UGameplayStatics::SpawnSound2D(World, Sound, Volume);
	return Current.IsValid();
}

void UVoiceSubsystem::Stop()
{
	if (UAudioComponent* Audio = Current.Get())
	{
		Audio->Stop();
	}
	Current.Reset();
}

void UVoiceSubsystem::SetVoiceEnabled(bool bEnabled)
{
	bVoiceEnabled = bEnabled;
	if (!bEnabled)
	{
		Stop();
	}
	SaveConfig();
}

void UVoiceSubsystem::SetVolume(float InVolume)
{
	Volume = FMath::Clamp(InVolume, 0.f, 1.f);
	if (UAudioComponent* Audio = Current.Get())
	{
		Audio->SetVolumeMultiplier(Volume);
	}
	SaveConfig();
}

FName UVoiceSubsystem::StatementId(FName Interrogation, FName Statement)
{
	return FName(*FString::Printf(TEXT("%s__%s"), *Interrogation.ToString(), *Statement.ToString()));
}

FName UVoiceSubsystem::ReactionId(FName Interrogation, FName Statement, bool bCorrect, bool bStatementHasOwnWrong)
{
	if (bCorrect)
	{
		return FName(*FString::Printf(TEXT("%s__%s__yes"), *Interrogation.ToString(), *Statement.ToString()));
	}
	if (bStatementHasOwnWrong)
	{
		return FName(*FString::Printf(TEXT("%s__%s__no"), *Interrogation.ToString(), *Statement.ToString()));
	}
	return FName(*FString::Printf(TEXT("%s__no"), *Interrogation.ToString()));
}

FName UVoiceSubsystem::LiveId(FName Interrogation, FName FeedId)
{
	return FName(*FString::Printf(TEXT("%s__live__%s"), *Interrogation.ToString(), *FeedId.ToString()));
}
