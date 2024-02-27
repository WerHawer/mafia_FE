import axios from 'axios'
import { IUser } from '../../App.tsx'

export const getUsers = async () => axios.get<IUser[]>('/users')
