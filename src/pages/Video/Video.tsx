import { Navigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'

export const VideoPage = () => {
  const id = uuid()

  return <Navigate to={id} replace={true} />
}
