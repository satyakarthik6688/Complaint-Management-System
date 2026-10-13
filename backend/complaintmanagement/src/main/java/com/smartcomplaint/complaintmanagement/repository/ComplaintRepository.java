
package com.smartcomplaint.complaintmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartcomplaint.complaintmanagement.model.Complaint;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Integer> {

}