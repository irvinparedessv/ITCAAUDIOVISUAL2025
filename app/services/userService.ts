import api from '~/api/axios';

interface ResetPasswordData {
  token: string | null;
  email: string | null;
  password: string;
  password_confirmation: string;
}

export const forgotPassword = async (email: string) => {
  return api.post('/forgot-password', { email });
};

export const resetPassword = async (data: ResetPasswordData) => {
  return api.post('/reset-password', data);
};
