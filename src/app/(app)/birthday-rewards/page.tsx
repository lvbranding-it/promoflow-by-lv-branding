
import BirthdayForm from "./birthday-form";

export default function BirthdayRewardsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-headline font-bold">Birthday Reward Automation</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Automate personalized birthday rewards. The AI will select the best reward based on customer data and available inventory.
        </p>
      </div>
      <BirthdayForm />
    </div>
  );
}
