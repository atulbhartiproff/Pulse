import { AxiosError } from "axios"
import { ApiError } from "./client"

function extractErrorMessage(err: unknown): string {
  const errDetail =
    (err as { body?: { detail?: unknown } })?.body?.detail ??
    (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail

  if (typeof errDetail === "string") {
    return errDetail
  }

  if (Array.isArray(errDetail) && errDetail.length > 0) {
    const firstError = errDetail[0] as { msg?: unknown }
    if (typeof firstError.msg === "string") {
      return firstError.msg
    }
  }

  if (err instanceof ApiError || err instanceof AxiosError) {
    return String(err.message)
  }

  return "Something went wrong."
}

export const handleError = function (
  this: (msg: string) => void,
  err: unknown,
) {
  const errorMessage = extractErrorMessage(err)
  this(errorMessage)
}

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}
