import axios from 'axios';
import { IUser } from '../../types/user';

export const getUsers = async () => axios.get<IUser[]>('/users');
