import React, { useState } from 'react'

const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    async function handleAuth() {
        try {
            const response = await axios(`${import.meta.env.VITE_API_URL}/api/admin/auth/login`, {
                email,
                password
            })

            if (response.status === 200) {

            }
        } catch (error) {

        }
    }
    return (
        <>
            <div className='flex justify-center items-center w-full h-screen'>
                <div className='rounded-xl p-6 m-2 border-2 border-stone-800'>
                    <div className='flex flex-col gap-4'>
                        <h1 className='text-2xl font-bold text-center mb-2'>
                            Welcome Admin!!
                        </h1>

                        {/* email */}
                        <input
                            type="email"
                            placeholder='Email'
                            className='px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-500'
                        />
                        <input
                            type="password"
                            placeholder='Password'
                            className='px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-500'
                        />
                        <button className='px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors'>
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Auth