import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useNavigation } from "react-router-dom";

const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    async function handleAuth() {
        if (!email || !password) {
            toast.warn("Please enter both email and password.");
            return;
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/admin/auth/login`,
                { email, password }
            );

            console.log("Login Success:", response.data);

            //  Check for token presence
            if (response.data?.token) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("userData", JSON.stringify(response.data.user || {}));
                toast.success("Login successful! 🎉");
                navigate("/dashboard");
            } else {
                toast.error("Invalid response from server. Please try again.");
            }

        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Login failed. Please check your credentials.";
            toast.error(message);
            console.error("Login Failed:", error.response?.data || error.message);
        }
    }

    return (
        <div className="flex justify-center items-center w-full h-screen ">
            <div className="rounded-xl p-6 m-2 border-2 border-stone-800  shadow-md w-96">
                <div className="flex flex-col gap-4">
                    <h1 className="text-2xl font-bold text-center mb-2 text-stone-100">
                        Welcome Admin!!
                    </h1>

                    {/* Email */}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-500"
                    />

                    {/* Password */}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-500"
                    />

                    {/* Login Button */}
                    <button
                        onClick={handleAuth}
                        className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
