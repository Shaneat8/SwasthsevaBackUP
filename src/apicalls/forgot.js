import { message } from 'antd';
import axios from 'axios';

const sendPasswordResetEmail = async (email, resetLink) => {
    
    const apiKey = process.env.REACT_APP_SENDINBLUE_API_KEY;
   

    const emailData = {
        sender: {
            name: 'Swasthya Seva', // Replace with your app name
            email: 'swasthyasevawovv@gmail.com' // Replace with your sender email
        },
        to: [
            {
                email: email,
                name: email // Optionally, you can include the user's name here
            }
        ],
        subject: 'Password Reset Request',
        htmlContent:`
            <html>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                        <tr>
                            <td style="padding: 20px; text-align: center;">
                                <h2 style="color: #2992d6; margin: 0;">Swasthya Seva</h2>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px;">
                                <h3 style="color: #333; font-size:16px">Hello,</h3>
                                <p style="font-size: 16px; color: #555;">
                                    We received a request to reset the password for your account associated with 
                                    <strong>${email}</strong>. If you requested this change, please click the button below to reset your password:
                                </p>
                                <div style="text-align: center; margin: 20px 0;">
                                    <a href="${resetLink}" 
                                       style="
                                            display: inline-block;
                                            padding: 12px 24px;
                                            background-color: #2992d6;
                                            color: #ffffff;
                                            text-decoration: none;
                                            border-radius: 5px;
                                            font-size: 16px;
                                            font-weight: bold;
                                            border: none;
                                            cursor: pointer;
                                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                            text-align: center;
                                       ">
                                        Reset Password
                                    </a>
                                </div>
                                <p style="font-size: 16px; color: #555;">
                                    If you didn’t request a password reset, you can ignore this email. Your password will remain the same.
                                </p>
                                <p style="font-size: 14px; color: #888; margin-top: 30px;">
                                    Thanks,<br>
                                    The Swasthya Seva Team
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 20px; background-color: #f4f4f4; text-align: center; color: #888; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                                <p style="margin: 0;">Please do not reply to this email. This mailbox is not monitored, and you will not receive a response.</p>
                                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Swasthya Seva. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `
    };

    try {
        const response = await axios.post('https://api.sendinblue.com/v3/smtp/email', emailData, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey,
            },
        });
        console.log('Password reset email sent successfully!', response.data);
    } catch (error) {
        console.error('Error sending email:', error.response.data);
        message.error('Error sending email: ' + error.response.data.message);
    }
};

export default sendPasswordResetEmail;

