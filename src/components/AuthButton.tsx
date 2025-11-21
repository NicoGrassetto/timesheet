import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMsal } from '@azure/msal-react'
import { SignIn, SignOut, User } from '@phosphor-icons/react'
import { loginRequest } from '@/authConfig'

export function AuthButton() {
  const { instance, accounts } = useMsal()
  const isAuthenticated = accounts.length > 0

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const handleLogout = () => {
    instance.logoutPopup()
  }

  if (!isAuthenticated) {
    return (
      <Button onClick={handleLogin} variant="default" className="gap-2">
        <SignIn className="w-4 h-4" />
        Sign In with Microsoft
      </Button>
    )
  }

  const account = accounts[0]

  return (
    <Card className="flex items-center gap-3 p-3">
      <div className="flex items-center gap-2 flex-1">
        <User className="w-5 h-5 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{account.name}</span>
          <span className="text-xs text-muted-foreground">{account.username}</span>
        </div>
      </div>
      <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-2">
        <SignOut className="w-4 h-4" />
        Sign Out
      </Button>
    </Card>
  )
}
