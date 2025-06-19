import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase"; // adjust the path if needed

interface TournamentCard {
  id: string;
  eventName: string;
  date: string;
  location?: string;
}

const Cards: React.FC = () => {
  const [tournaments, setTournaments] = useState<TournamentCard[]>([]);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const q = query(collection(db, "tournaments"), orderBy("date"));
        const querySnapshot = await getDocs(q);
        const data: TournamentCard[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TournamentCard[];
        setTournaments(data);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      }
    };

    fetchTournaments();
  }, []);

  return (
    <div className="row">
      {tournaments.map((tourn, index) => (
        <div className="col-xl-4" key={index}>
          <div className="card col-md-4 col-xl-12">
            <img
              src="/images/tournament-logo-860-16353.png"
              alt="Tournament Logo"
              width="800"
              height="281"
              className="img-fluid"
            />
            <div className="card-body">
              <h5 className="card-title">{tourn.date}</h5>
              <p className="card-text">{tourn.eventName}</p>
              <a href={`/tournament/${tourn.id}`} className="btn btn-primary">
                Details
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Cards;
