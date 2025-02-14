import { SignIn } from "@clerk/react-router";

export default function SignInPage() {
	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<SignIn />
		</div>
	);
}
