
import SocialRewardForm from "./social-reward-form";

export default function SocialRewardsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-headline font-bold">Social Media Rewards</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Reward customers for sharing on social media. The AI will generate a personalized reward based on their profile and platform.
        </p>
      </div>
      <SocialRewardForm />
    </div>
  );
}
