import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyDGJN6QnLFSeyzVBzBeyTCfk48ZQb-qOb4",
    authDomain: "next-commerce-72834.firebaseapp.com",
    projectId: "next-commerce-72834",
    storageBucket: "next-commerce-72834.appspot.com",
    messagingSenderId: "353053102795",
    appId: "1:353053102795:web:4fe7c305717e693dee014e",
    measurementId: "G-EJGQ2LNZ5J"
};

const app = initializeApp(firebaseConfig)

export const authentication = getAuth(app)
