
package com.smartcomplaint.complaintmanagement.service;

import java.util.List;

import org.springframework.stereotype.Service;
import com.smartcomplaint.complaintmanagement.model.ComplaintStatus;

import com.smartcomplaint.complaintmanagement.model.Complaint;
import com.smartcomplaint.complaintmanagement.repository.ComplaintRepository;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;

    public ComplaintService(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    public Complaint createComplaint(Complaint complaint) {
        return complaintRepository.save(complaint);
    }

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public Complaint getComplaintById(Integer id) {
        return complaintRepository.findById(id).orElse(null);
    }

    public Complaint updateComplaint(Integer id, Complaint updatedComplaint) {
        return complaintRepository.findById(id).map(complaint -> {
            complaint.setTitle(updatedComplaint.getTitle());
            complaint.setDescription(updatedComplaint.getDescription());
            complaint.setCategory(updatedComplaint.getCategory());
            complaint.setLocation(updatedComplaint.getLocation());
            complaint.setComplainantName(updatedComplaint.getComplainantName());

            return complaintRepository.save(complaint);
        }).orElse(null);
    }

    public boolean deleteComplaint(Integer id) {
        if (!complaintRepository.existsById(id)) {
            return false;
        }

        complaintRepository.deleteById(id);
        return true;
    }

public Complaint updateComplaintStatus(
        Integer id, ComplaintStatus status) {

    return complaintRepository.findById(id)
            .map(complaint -> {
                complaint.setStatus(status);
                return complaintRepository.save(complaint);
            })
            .orElse(null);
}

}