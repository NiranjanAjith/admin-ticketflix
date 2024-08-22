import { firestore } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const extractInfoFromUrl = () => {
    const url = window.location.href;
    const ticketId = url.split('/').pop(); // Get the last part of the URL

    console.log('Full URL:', url);
    console.log('Extracted ticket-id:', ticketId);

    if (ticketId.length !== 7) { // FIXME: Check & confirm if ticket-id length is 7
        console.error('Invalid URL format. Expected 7 characters, got:', ticketId.length);
        throw new Error('Invalid Ticket-id');
    }
    return ticketId;
};

const verifyAndGetTicket = async () => {
    try {
        const ticketId = extractInfoFromUrl();

        console.log('Attempting to fetch ticket with id:', ticketId);
        
        // Fetch data using ticket-id field
        const ticketsRef = collection(firestore, 'tickets');
        const q = query(ticketsRef, where('ticket-id', '==', ticketId));
        
        try {
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                console.log('Document found');
                const doc = querySnapshot.docs[0];
                const data = doc.data();
                console.log('Document data:', data);
                return data;
            } else {
                console.log('Document not found');
                return null;
            }
        } catch (error) {
            console.error('Error fetching document:', error);
            return null;
        }
    } catch (error) {
        // TODO: Show custom error page instead (use HTML template)
        console.error("Error in verifyTicketCode:", error);
        return null;
    }
};



export { extractInfoFromUrl, verifyAndGetTicket };