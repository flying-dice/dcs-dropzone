import type {AuthService} from "./auth.service.ts";
import { githubAuthService } from "./github-auth.service.ts";

export enum AuthServices {
  Github = "github",
}

export const authServices: Record<AuthServices, AuthService> = {
  [AuthServices.Github]: githubAuthService,
};
