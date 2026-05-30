import { createClient } from "@supabase/supabase-js"
import { useNavigate } from "react-router-dom";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function Auth() {
    const navigate = useNavigate();
 async function login(provider: "google" | "github") {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: "http://localhost:5173/dashboard",
    },
  })

  if (error) {
    console.error(error)
  }
}
return (
    <div>
      <button onClick={() => login("google")}>
        Login with Google
      </button>

<h1 className="text-3xl font-bold underline">
    hiii
</h1>

      <button onClick={() => login("github")}>
        Login with GitHub
      </button>
    </div>
  )
}