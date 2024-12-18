import { UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { handleError, post } from 'data/fetchers'
import { toast } from 'sonner'
import { ResponseError } from 'types'
import { analyticsKeys } from './keys'

type WarehouseAccessTokenCreateVariables = {
  ref: string
  description: string
}

/**
 * This will be deprecated or rewritten in favor of the new project API keys
 */
async function createWarehouseAccessToken({
  ref,
  description,
}: WarehouseAccessTokenCreateVariables) {
  // TODO: remove type cast when fetcher fn params are typed
  const { data, error } = await post(`/platform/projects/{ref}/analytics/warehouse/access-tokens`, {
    params: {
      path: { ref },
    },
    body: { description },
  } as any)

  if (error) handleError(error)

  return data
}

type WarehouseAccessTokenUpdateData = Awaited<ReturnType<typeof createWarehouseAccessToken>>

export function useCreateWarehouseAccessToken({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    WarehouseAccessTokenUpdateData,
    ResponseError,
    WarehouseAccessTokenCreateVariables
  >,
  'mutationFn'
> = {}) {
  const queryClient = useQueryClient()

  return useMutation(
    (payload: WarehouseAccessTokenCreateVariables) => createWarehouseAccessToken(payload),
    {
      async onSuccess(data, vars, context) {
        await queryClient.invalidateQueries(analyticsKeys.warehouseAccessTokens(vars.ref))
        await onSuccess?.(data, vars, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create token: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
