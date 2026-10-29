#include "Audio/VoiceSubsystem.h"

#include "Animation/AnimInstance.h"
#include "Animation/AnimMontage.h"
#include "Animation/AnimSequenceBase.h"
#include "Components/AudioComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "GameFramework/Actor.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"
#include "Sound/SoundBase.h"
#include "UObject/SoftObjectPath.h"

DEFINE_LOG_CATEGORY_STATIC(LogVoice, Log, All);

namespace
{
	// Слот анимационного блупринта лица MetaHuman, в который проигрываются анимации поверх его обычной работы.
	const FName FaceSlot(TEXT("DefaultSlot"));
	constexpr float FaceBlend = 0.2f;

	UAnimSequenceBase* LoadAnim(const FString& Folder, const FString& Name)
	{
		return Cast<UAnimSequenceBase>(FSoftObjectPath(FString::Printf(TEXT("%s/%s.%s"), *Folder, *Name, *Name)).TryLoad());
	}
}

USkeletalMeshComponent* UVoiceSubsystem::FindFace(AActor* Character)
{
	if (!Character)
	{
		return nullptr;
	}
	TArray<USkeletalMeshComponent*> Meshes;
	Character->GetComponents<USkeletalMeshComponent>(Meshes);
	for (USkeletalMeshComponent* Mesh : Meshes)
	{
		if (Mesh && Mesh->GetName() == TEXT("Face"))
		{
			return Mesh;
		}
	}
	return nullptr;
}

void UVoiceSubsystem::StartFaceIdle(AActor* Character)
{
	USkeletalMeshComponent* Face = FindFace(Character);
	UAnimInstance* Anim = Face ? Face->GetAnimInstance() : nullptr;
	UAnimSequenceBase* Idle = LoadAnim(TEXT("/Game/Characters/Animations"), TEXT("Face_Idle"));
	if (!Anim || !Idle)
	{
		return;
	}
	IdleFaces.Add(Anim, Idle);
	Anim->OnMontageEnded.AddUniqueDynamic(this, &UVoiceSubsystem::HandleMontageEnded);
	PlayIdleOn(Anim);
}

void UVoiceSubsystem::PlayIdleOn(UAnimInstance* Anim)
{
	const TWeakObjectPtr<UAnimSequenceBase>* Idle = Anim ? IdleFaces.Find(Anim) : nullptr;
	if (Idle && Idle->IsValid())
	{
		// Долгий цикл: моргание и мелкие движения лица, пока персонаж молчит.
		Anim->PlaySlotAnimationAsDynamicMontage(Idle->Get(), FaceSlot, FaceBlend, FaceBlend, 1.f, 10000);
	}
}

void UVoiceSubsystem::HandleMontageEnded(UAnimMontage* Montage, bool bInterrupted)
{
	// Реплика закончилась (или её прервали) — лицо возвращается к спокойному циклу.
	if (Montage && Montage == SpeakingMontage.Get())
	{
		UAnimInstance* Anim = SpeakingFace.Get();
		SpeakingMontage.Reset();
		SpeakingFace.Reset();
		PlayIdleOn(Anim);
	}
}

bool UVoiceSubsystem::Play(FName VoiceId, AActor* Speaker)
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

	// Губы и мимика: анимация лица, сделанная из этого же аудиофайла (MetaHuman Animator).
	USkeletalMeshComponent* Face = FindFace(Speaker);
	UAnimInstance* Anim = Face ? Face->GetAnimInstance() : nullptr;
	if (UAnimSequenceBase* Lips = Anim ? LoadAnim(TEXT("/Game/Voice/Face"), Name) : nullptr)
	{
		Anim->OnMontageEnded.AddUniqueDynamic(this, &UVoiceSubsystem::HandleMontageEnded);
		SpeakingMontage.Reset(); // старый монтаж прервётся — не возвращаем по нему спокойное лицо
		SpeakingFace = Anim;
		SpeakingMontage = Anim->PlaySlotAnimationAsDynamicMontage(Lips, FaceSlot, FaceBlend, FaceBlend, 1.f, 1);
	}
	return Current.IsValid();
}

void UVoiceSubsystem::Stop()
{
	if (UAudioComponent* Audio = Current.Get())
	{
		Audio->Stop();
	}
	Current.Reset();
	if (UAnimInstance* Anim = SpeakingFace.Get())
	{
		// Остановка монтажа речи вызовет HandleMontageEnded, и лицо вернётся к спокойному циклу.
		Anim->StopSlotAnimation(FaceBlend, FaceSlot);
	}
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
