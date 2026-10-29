#include "Audio/MusicSubsystem.h"

#include "Components/AudioComponent.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"
#include "Sound/SoundWave.h"
#include "UObject/SoftObjectPath.h"

namespace
{
	constexpr float FadeTime = 1.5f;
	const FName ThemeTrack(TEXT("Theme"));

	USoundBase* LoadTrack(FName Track)
	{
		const FString Name = Track.ToString();
		return Cast<USoundBase>(FSoftObjectPath(FString::Printf(TEXT("/Game/Music/%s.%s"), *Name, *Name)).TryLoad());
	}
}

void UMusicSubsystem::PlayForLevel(const UObject* WorldContext)
{
	const FName Level(*UGameplayStatics::GetCurrentLevelName(WorldContext, true));
	PlayFirst(WorldContext, { Level, ThemeTrack });
}

void UMusicSubsystem::PlaySpecial(const UObject* WorldContext, FName Track)
{
	PlayFirst(WorldContext, { Track });
}

void UMusicSubsystem::PlayFirst(const UObject* WorldContext, std::initializer_list<FName> Tracks)
{
	if (!bMusicEnabled)
	{
		Stop(0.f);
		return;
	}
	for (const FName Track : Tracks)
	{
		if (Track == CurrentTrack && Current.IsValid())
		{
			return; // уже играет — не перезапускаем (например, при переезде между локациями с одной темой)
		}
		USoundBase* Sound = LoadTrack(Track);
		if (!Sound)
		{
			continue;
		}
		if (USoundWave* Wave = Cast<USoundWave>(Sound))
		{
			Wave->bLooping = true;
		}
		Stop(FadeTime);
		// Звук переживает смену уровня: одна и та же тема играет без обрыва.
		UAudioComponent* Audio = UGameplayStatics::CreateSound2D(WorldContext, Sound, Volume, 1.f, 0.f, nullptr, true, true);
		if (Audio)
		{
			Audio->FadeIn(FadeTime, Volume);
		}
		Current = Audio;
		CurrentTrack = Track;
		return;
	}
}

void UMusicSubsystem::Stop(float FadeSeconds)
{
	if (UAudioComponent* Audio = Current.Get())
	{
		if (FadeSeconds > 0.f)
		{
			Audio->FadeOut(FadeSeconds, 0.f);
		}
		else
		{
			Audio->Stop();
		}
	}
	Current.Reset();
	CurrentTrack = NAME_None;
}

void UMusicSubsystem::SetMusic(bool bEnabled, float InVolume)
{
	bMusicEnabled = bEnabled;
	Volume = FMath::Clamp(InVolume, 0.f, 1.f);
	SaveConfig();
	if (!bMusicEnabled)
	{
		Stop(0.5f);
	}
	else if (UAudioComponent* Audio = Current.Get())
	{
		Audio->SetVolumeMultiplier(Volume);
	}
	else if (UGameInstance* GI = GetGameInstance())
	{
		PlayForLevel(GI->GetWorld());
	}
}
