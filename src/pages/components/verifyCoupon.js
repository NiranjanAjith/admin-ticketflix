import { firestore } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

import sha256 from 'js-sha256';

const extractInfoFromUrl = () => {
    const url = window.location.href;
    const path = url.split('/').pop(); // Get the last part of the URL

    // console.log('Full URL:', url);
    // console.log('Extracted path:', path);

    if (path.length !== 84) {
        console.error('Invalid URL format. Expected 84 characters, got:', path.length);
        throw new Error('Invalid URL format');
    }

    const hashedCouponCode = path.substring(0, 64);
    const docRefId = path.substring(64);

    console.log('Extracted hashed coupon code:', hashedCouponCode);
    console.log('Extracted docRefId:', docRefId);

    return { hashedCouponCode, docRefId };
};

const verifyCouponCode = async () => {
    try {
        const { hashedCouponCode, docRefId } = extractInfoFromUrl();

        console.log('Attempting to fetch document with id:', docRefId);

        const docRef = doc(firestore, 'coupons', docRefId);
        const docSnap = await getDoc(docRef);
        // const docRef = firestore.collection('tickets').doc(docRefId);
        // const doc = await docRef.get();

        if (docSnap.exists()) {
            console.log('Document found');
            const data = docSnap.data();
            console.log('Document data:', data);

            if (!data.coupon_code) {
                console.error('coupon_code field not found in document');
                return null;
            }

            console.log('Original coupon code from document:', data.coupon_code);
            const computedHashedCouponCode = sha256(data.coupon_code);
            console.log('Computed hashed coupon code:', computedHashedCouponCode);
            console.log('Hashed coupon code from URL:', hashedCouponCode);

            if (computedHashedCouponCode === hashedCouponCode) {
                console.log('Coupon code verified successfully');
                return data;
            } else {
                console.log('Coupon code verification failed');
                return null;
            }
        } else {
            console.log('Document not found');
            return null;
        }
    } catch (error) {
        // TODO: Show custom error page instead (use HTML template)
        console.error("Error in verifyCouponCode:", error);
        return null;
    }
};



export { extractInfoFromUrl, verifyCouponCode };